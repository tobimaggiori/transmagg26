VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form BuscEmpresas 
   Caption         =   "Buscar Empresas"
   ClientHeight    =   3120
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   6000
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   3120
   ScaleWidth      =   6000
   Begin VB.Frame BuscaEmpresas 
      Caption         =   "BuscarEmpresas"
      Height          =   2895
      Left            =   0
      TabIndex        =   0
      Top             =   0
      Width           =   5895
      Begin VB.TextBox buscar 
         Appearance      =   0  'Flat
         Height          =   285
         Left            =   1080
         TabIndex        =   1
         Text            =   "Text5"
         Top             =   2280
         Width           =   4575
      End
      Begin MSComctlLib.ListView ListEmpresas 
         Height          =   1815
         Left            =   240
         TabIndex        =   2
         Top             =   360
         Width           =   5500
         _ExtentX        =   9710
         _ExtentY        =   3201
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   2
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "CodEmpresas"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Descripcion"
            Object.Width           =   7056
         EndProperty
      End
      Begin VB.Label Label34 
         Alignment       =   2  'Center
         Caption         =   "Buscar"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   240
         TabIndex        =   3
         Top             =   2280
         Width           =   855
      End
   End
End
Attribute VB_Name = "BuscEmpresas"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Buscar_Change()
Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE DescEmpresas LIKE '*" & buscar & "*' ORDER BY DescEmpresas")
ListEmpresas.ListItems.Clear
Do While Not rsEmpresas.EOF
    Set LEmpresas = ListEmpresas.ListItems.Add(, , rsEmpresas!codEmpresas)
        LEmpresas.Tag = rsEmpresas!codEmpresas
        LEmpresas.SubItems(1) = rsEmpresas!DescEmpresas
    rsEmpresas.MoveNext
Loop
Set rsEmpresas = Nothing

End Sub

Private Sub Form_Load()
Set rsEmpresas = db.OpenRecordset("Empresas")
Do While Not rsEmpresas.EOF
    Set LEmpresas = ListEmpresas.ListItems.Add(, , rsEmpresas!codEmpresas)
        LEmpresas.Tag = rsEmpresas!codEmpresas
        LEmpresas.SubItems(1) = rsEmpresas!DescEmpresas
        rsEmpresas.MoveNext
Loop
buscar = ""
End Sub

Private Sub ListEmpresas_DblClick()
Set LEmpresas = ListEmpresas.ListItems.Item(ListEmpresas.SelectedItem.Index)
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & LEmpresas.Tag & "")
    If Viene = "Factura" Then
        If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
            With FactEmpresas
            .Text3(0) = rsEmpresas!codEmpresas
            .Text3(1) = rsEmpresas!DescEmpresas
            .Text3(2) = rsEmpresas!Direccion
            .Text3(3) = rsEmpresas!Localidad
            .Text3(4) = rsEmpresas!CUIT
           BuscEmpresas.Hide
            .FFact.SetFocus
            End With
            Viene = ""
        End If
    End If
    If Viene = "CtaCte" Then
        If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
            With ConsCtaCte
            .Text6(0) = rsEmpresas!codEmpresas
            .Text6(1) = rsEmpresas!DescEmpresas
           BuscEmpresas.Hide
            .FDesde.SetFocus
            End With
            Viene = ""
        End If
    End If
    If Viene = "Recibo" Then
        If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
            With RecCobranza
            .Text1 = rsEmpresas!codEmpresas
            .Label1 = rsEmpresas!DescEmpresas
            BuscEmpresas.Hide
            End With
            Viene = ""
        End If
    End If
End Sub

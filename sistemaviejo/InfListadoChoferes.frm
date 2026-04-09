VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form InfListadoChoferes 
   BackColor       =   &H80000012&
   Caption         =   "Listado de Choferes"
   ClientHeight    =   2460
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2460
   ScaleWidth      =   4680
   Begin VB.Frame Frame1 
      BackColor       =   &H80000012&
      Caption         =   "Parametros"
      ForeColor       =   &H0080FFFF&
      Height          =   1695
      Left            =   360
      TabIndex        =   0
      Top             =   0
      Width           =   3975
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   1
         Left            =   1320
         TabIndex        =   4
         Text            =   "Text1"
         Top             =   1320
         Width           =   2415
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   0
         Left            =   600
         TabIndex        =   3
         Text            =   "Text1"
         Top             =   1320
         Width           =   615
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000012&
         Caption         =   "De un Fletero"
         ForeColor       =   &H0080FFFF&
         Height          =   195
         Index           =   1
         Left            =   360
         TabIndex        =   2
         Top             =   960
         Width           =   1695
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000012&
         Caption         =   "Todos"
         ForeColor       =   &H0080FFFF&
         Height          =   195
         Index           =   0
         Left            =   360
         TabIndex        =   1
         Top             =   480
         Width           =   1215
      End
   End
   Begin KewlButtonz.KewlButtons Generar 
      Height          =   495
      Left            =   480
      TabIndex        =   5
      Top             =   1800
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Generar Informe"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "InfListadoChoferes.frx":0000
      PICN            =   "InfListadoChoferes.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Exportar 
      Height          =   495
      Left            =   2280
      TabIndex        =   6
      Top             =   1800
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Exportar a Excell"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "InfListadoChoferes.frx":209E
      PICN            =   "InfListadoChoferes.frx":20BA
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
End
Attribute VB_Name = "InfListadoChoferes"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Exportar_Click()
Set TrsChoferes = dbTemp.OpenRecordset("InfChoferes")
Do While Not TrsChoferes.EOF
    TrsChoferes.Delete
    TrsChoferes.MoveNext
Loop
If Option1(0).Value = True Then
    Set rsChoferes = db.OpenRecordset("choferes")
    Do While Not rsChoferes.EOF
        TrsChoferes.AddNew
        TrsChoferes.Fields("CodFlet") = rsChoferes!CodFlet
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsChoferes!CodFlet & "")
        TrsChoferes.Fields("DescFlet") = rsFleteros!DescFlet
        TrsChoferes.Fields("CuitFlet") = rsFleteros!cuit
        TrsChoferes.Fields("CodChofer") = rsChoferes!CodChoferes
        TrsChoferes.Fields("DescChofer") = rsChoferes!AyN
        TrsChoferes.Fields("PatChasis") = rsChoferes!PatChasis
        TrsChoferes.Fields("PatAcop") = rsChoferes!PatAcop
        TrsChoferes.Fields("CuitChofer") = rsChoferes!CUIL
        TrsChoferes.Update
        rsChoferes.MoveNext
    Loop
Else
    Set rsChoferes = db.OpenRecordset("SELECT * FROM Choferes WHERE CodFlet = " & Text1(0) & "")
    Do While Not rsChoferes.EOF
        TrsChoferes.AddNew
        TrsChoferes.Fields("CodFlet") = rsChoferes!CodFlet
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsChoferes!CodFlet & "")
        TrsChoferes.Fields("DescFlet") = rsFleteros!DescFlet
        TrsChoferes.Fields("CuitFlet") = rsFleteros!cuit
        TrsChoferes.Fields("CodChofer") = rsChoferes!CodChoferes
        TrsChoferes.Fields("DescChofer") = rsChoferes!AyN
        TrsChoferes.Fields("PatChasis") = rsChoferes!PatChasis
        TrsChoferes.Fields("PatAcop") = rsChoferes!PatAcop
        TrsChoferes.Fields("CuitChofer") = rsChoferes!CUIL
        TrsChoferes.Update
        rsChoferes.MoveNext
    Loop
End If
Call Exportar_excell1

End Sub

Private Sub Form_Load()
Option1(0).Value = True
Option1(1).Value = False
Text1(0) = ""
Text1(1) = ""
End Sub

Private Sub Generar_Click()
Set TrsChoferes = dbTemp.OpenRecordset("InfChoferes")
Do While Not TrsChoferes.EOF
    TrsChoferes.Delete
    TrsChoferes.MoveNext
Loop
If Option1(0).Value = True Then
    Set rsChoferes = db.OpenRecordset("choferes")
    Do While Not rsChoferes.EOF
        TrsChoferes.AddNew
        TrsChoferes.Fields("CodFlet") = rsChoferes!CodFlet
        TrsChoferes.Fields("CodChofer") = rsChoferes!CodChoferes
        TrsChoferes.Update
        rsChoferes.MoveNext
    Loop
Else
    Set rsChoferes = db.OpenRecordset("SELECT * FROM Choferes WHERE CodFlet = " & Text1(0) & "")
    Do While Not rsChoferes.EOF
        TrsChoferes.AddNew
        TrsChoferes.Fields("CodFlet") = rsChoferes!CodFlet
        TrsChoferes.Fields("CodChofer") = rsChoferes!CodChoferes
        TrsChoferes.Update
        rsChoferes.MoveNext
    Loop
End If
 Dim frmRep As New InfChoferes
    frmRep.Show vbModal

End Sub

Private Sub Text1_LostFocus(Index As Integer)
If Index = 0 Then
    If Not Text1(0) = "" Then
        Criterio = "CodFlet = " & Text1(0)
        Sql = "SELECT * FROM Fleteros WHERE " & Criterio
        Set rsFleteros = db.OpenRecordset(Sql, 2)
        Text1(1) = rsFleteros!DescFlet
    End If
End If

End Sub

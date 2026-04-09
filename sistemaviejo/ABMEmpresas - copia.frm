VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form ABMEmpresas 
   Caption         =   "ABMEmpresas"
   ClientHeight    =   4395
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   7620
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   4395
   ScaleWidth      =   7620
   Begin VB.Frame ABMEmpresas 
      ForeColor       =   &H00FF0000&
      Height          =   4335
      Left            =   0
      TabIndex        =   0
      Top             =   0
      Width           =   7575
      Begin VB.CommandButton cmdMover 
         Caption         =   "<<"
         Height          =   435
         Index           =   0
         Left            =   2880
         TabIndex        =   12
         Top             =   2880
         Width           =   495
      End
      Begin VB.CommandButton cmdMover 
         Caption         =   "<"
         Height          =   435
         Index           =   1
         Left            =   3360
         TabIndex        =   11
         Top             =   2880
         Width           =   495
      End
      Begin VB.CommandButton cmdMover 
         Caption         =   ">"
         Height          =   435
         Index           =   2
         Left            =   3900
         TabIndex        =   10
         Top             =   2880
         Width           =   495
      End
      Begin VB.CommandButton cmdMover 
         Caption         =   ">>"
         Height          =   435
         Index           =   3
         Left            =   4440
         TabIndex        =   9
         Top             =   2880
         Width           =   495
      End
      Begin VB.ComboBox Combo1 
         Appearance      =   0  'Flat
         Height          =   315
         Left            =   4680
         TabIndex        =   8
         Text            =   "Combo1"
         Top             =   2400
         Width           =   2655
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   6
         Left            =   1560
         TabIndex        =   7
         Text            =   "Text1"
         Top             =   2400
         Width           =   1695
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   5
         Left            =   1560
         TabIndex        =   6
         Text            =   "Text1"
         Top             =   2040
         Width           =   5775
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   4
         Left            =   1560
         TabIndex        =   5
         Text            =   "Text1"
         Top             =   1680
         Width           =   5775
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   3
         Left            =   3720
         TabIndex        =   4
         Text            =   "Text1"
         Top             =   1320
         Width           =   3615
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   2
         Left            =   1560
         TabIndex        =   3
         Text            =   "Text1"
         Top             =   1320
         Width           =   1095
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   1
         Left            =   1560
         TabIndex        =   2
         Text            =   "Text1"
         Top             =   960
         Width           =   5775
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   0
         Left            =   1560
         TabIndex        =   1
         Text            =   "Text1"
         Top             =   600
         Width           =   5775
      End
      Begin KewlButtonz.KewlButtons Modificar 
         Height          =   495
         Left            =   1560
         TabIndex        =   13
         Top             =   3600
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cambiar"
         ENAB            =   0   'False
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
         MICON           =   "ABMEmpresas.frx":0000
         PICN            =   "ABMEmpresas.frx":001C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Eliminar 
         Height          =   495
         Left            =   360
         TabIndex        =   14
         Top             =   3600
         Width           =   1095
         _ExtentX        =   1931
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Eliminar"
         ENAB            =   0   'False
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
         MICON           =   "ABMEmpresas.frx":562E
         PICN            =   "ABMEmpresas.frx":564A
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Buscar 
         Height          =   495
         Left            =   3000
         TabIndex        =   15
         Top             =   3600
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Buscar"
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
         MICON           =   "ABMEmpresas.frx":5BE4
         PICN            =   "ABMEmpresas.frx":5C00
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Aceptar 
         Height          =   495
         Left            =   4440
         TabIndex        =   16
         Top             =   3600
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Aceptar"
         ENAB            =   0   'False
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
         MICON           =   "ABMEmpresas.frx":790A
         PICN            =   "ABMEmpresas.frx":7926
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Cancelar 
         Height          =   495
         Left            =   5880
         TabIndex        =   17
         Top             =   3600
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cancelar"
         ENAB            =   0   'False
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
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMEmpresas.frx":99A8
         PICN            =   "ABMEmpresas.frx":99C4
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label3 
         Caption         =   "Código Postal"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   120
         TabIndex        =   25
         Top             =   1320
         Width           =   1455
      End
      Begin VB.Label Label4 
         Caption         =   "Localidad"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   2760
         TabIndex        =   24
         Top             =   1320
         Width           =   1455
      End
      Begin VB.Label Label5 
         Caption         =   "Telefono"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   120
         TabIndex        =   23
         Top             =   1680
         Width           =   1455
      End
      Begin VB.Label Label6 
         Caption         =   "Email"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   120
         TabIndex        =   22
         Top             =   2040
         Width           =   1455
      End
      Begin VB.Label Label8 
         Caption         =   "Condición IVA"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   3360
         TabIndex        =   21
         Top             =   2400
         Width           =   1455
      End
      Begin VB.Label Label9 
         Caption         =   "CUIT"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   120
         TabIndex        =   20
         Top             =   2400
         Width           =   975
      End
      Begin VB.Label Label2 
         Caption         =   "Dirección"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   120
         TabIndex        =   19
         Top             =   960
         Width           =   1455
      End
      Begin VB.Label Label1 
         Caption         =   "Razón Social"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   120
         TabIndex        =   18
         Top             =   600
         Width           =   1455
      End
   End
End
Attribute VB_Name = "ABMEmpresas"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Aceptar_Click()
If Accion = "Nuevo" Then
On Error GoTo ERR_cmdAltaRegistro:
    Dim nAccessValue As Integer
    Screen.MousePointer = vbHourglass
    nAccessValue = 0
    ' aplica los permisos deseados por el usuario
    nAccessValue = nAccessValue + dbDenyWrite
    Set rsEmpresas = db.OpenRecordset("Empresas")
    Dim lPrimaryKey As Long
    Dim sMessage As String
    ' recupera una clave única desde la rutina GetPrimaryKey
    lPrimaryKey = CodigoEmpresas
        With rsEmpresas
            .AddNew
            .Fields("CodEmpresas") = lPrimaryKey
            .Fields("DescEmpresas") = Text1(0)
            .Fields("Direccion") = Text1(1)
            .Fields("Telefono") = Text1(4)
            .Fields("EMail") = Text1(5)
            .Fields("CUIT") = Text1(6)
            .Fields("CP") = Text1(2)
            .Fields("Localidad") = Text1(3)
            .Fields("CodIVA") = Combo1.ListIndex + 1
            .Update
        End With
        Set rsEmpresas = Nothing
        Combo1.ListIndex = 0
        Items = 0
        For Items = Items + 1 To Text1.Count
            Text1(Items - 1) = ""
        Next
        Aceptar.Enabled = True: Cancelar.Enabled = True: Buscar.Enabled = True: Eliminar.Enabled = False
        Accion = "Nuevo"
        ' Si el código pasa por aquí es porque todo ha ido bien
        sMessage = "La Empresa fue agregado exitosamente con el Codigo:   " & lPrimaryKey
        MsgBox sMessage, vbInformation, "Alta Fletero"
        Screen.MousePointer = vbDefault
        Exit Sub
ERR_cmdAltaRegistro:
    TableError Err
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Buscar" Then
On Error GoTo ERR_cmdBuscar:
     Screen.MousePointer = vbHourglass
     Items = 0: Criterio = ""
     For Items = Items + 1 To Text1.Count
        If Not Text1(Items - 1).Text = "" Then
            If Not Criterio = "" Then
                Criterio = Criterio & " AND "
            End If
            Select Case Text1(Items - 1).Index
                Case 0: Criterio = Criterio & "DescEmpresas Like '*" & Text1(0) & "*'"
                Case 1: Criterio = Criterio & "Direccion LIKE '*" & Text1(1) & "*'"
                Case 2: Criterio = Criterio & "CP LIKE '*" & Text1(2) & "*'"
                Case 3: Criterio = Criterio & "Localidad LIKE '*" & Text1(3) & "*'"
                Case 4: Criterio = Criterio & "Telefono LIKE '*" & Text1(4) & "*'"
                Case 5: Criterio = Criterio & "Email LIKE '*" & Text1(5) & "*'"
                Case 6: Criterio = Criterio & "CUIT LIKE '*" & Text1(6) & "*'"
            End Select
        End If
    Next
    If Not Criterio = "" Then
        SQL = "SELECT * FROM Empresas WHERE " & Criterio & ""
    Else
        SQL = "SELECT * FROM Empresas"
    End If
    Set rsEmpresas = db.OpenRecordset(SQL)
    Call MostrarRegistroEmpresas
    Modificar.Enabled = True: Aceptar.Enabled = False
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdBuscar:
    TableError Err
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Modificar" Then
On Error GoTo ERR_cmdModificar
    Screen.MousePointer = vbHourglass
    With rsEmpresas
        .Fields("DescEmpresas") = Text1(0)
        .Fields("Direccion") = Text1(1)
        .Fields("CP") = Text1(2)
        .Fields("Localidad") = Text1(3)
        .Fields("Telefono") = Text1(4)
        .Fields("Email") = Text1(5)
        .Fields("CUIT") = Text1(6)
        .Fields("CodIVA") = Combo1.ListIndex + 1
        .Update
        .LockEdits = False
    End With
    MsgBox "La Empresa ha sido Modificado Exitosamente", vbInformation, "Modificar Registro"
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &HFFFFFF
        Text1(Items - 1) = ""
    Next
    Combo1.BackColor = &HFFFFFF
    Combo1.ListIndex = 0
    Accion = "Nuevo"
    Items = 0
        For Items = Items + 1 To cmdMover.Count
             cmdMover(Items - 1).Visible = False
        Next
    Eliminar.Enabled = False: Buscar.Enabled = True: Aceptar.Enabled = True: Cancelar.Enabled = True
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdModificar:
    TableError Err
    Set rsEmpresas = Nothing
End If

End Sub

Private Sub Buscar_Click()
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1).BackColor = &H40C0&
Next
Combo1.BackColor = &H40C0&
Eliminar.Enabled = False: Modificar.Enabled = False: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True
Accion = "Buscar"
End Sub

Private Sub Cancelar_Click()
Set rsSituacionIVA = db.OpenRecordset("SituacionIVA", 2)
Combo1.Clear
Do While Not rsSituacionIVA.EOF
    Combo1.AddItem rsSituacionIVA!Descripcion
    rsSituacionIVA.MoveNext
Loop
Combo1.ListIndex = 0
Combo1.BackColor = &H80000005
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1) = ""
    Text1(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover.Count
    cmdMover(Items - 1).Visible = False
Next
Aceptar.Enabled = True: Cancelar.Enabled = True: Buscar.Enabled = True: Eliminar.Enabled = False: Modificar.Enabled = False
Accion = "Nuevo"
End Sub

Private Sub Form_Load()
Set rsSituacionIVA = db.OpenRecordset("SituacionIVA", 2)
Combo1.Clear
Do While Not rsSituacionIVA.EOF
    Combo1.AddItem rsSituacionIVA!Descripcion
    rsSituacionIVA.MoveNext
Loop
Combo1.ListIndex = 0
Combo1.BackColor = &H80000005
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1) = ""
    Text1(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover.Count
    cmdMover(Items - 1).Visible = False
Next
Aceptar.Enabled = True: Cancelar.Enabled = True: Buscar.Enabled = True: Eliminar.Enabled = False: Modificar.Enabled = False
Accion = "Nuevo"
End Sub

Private Sub Modificar_Click()
On Error GoTo ERR_cmdCambiar:
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1).BackColor = &HFFFFFF
Next
Combo1.BackColor = &HFFFFFF
Eliminar.Enabled = False: Modificar.Enabled = False: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True
rsEmpresas.Edit
rsEmpresas.LockEdits = True
Accion = "Modificar"
Exit Sub
ERR_cmdCambiar:
    TableError Err
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &H40C0&
    Next
    Combo1.BackColor = &H40C0&
    Eliminar.Enabled = False: Modificar.Enabled = True: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True

End Sub

